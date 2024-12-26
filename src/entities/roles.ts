import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from "typeorm";
import { RolesAccess } from "./roleAccess";
import { ChildRoles } from "./childRoles";
import { UserData } from "./userData";
import { AssignedMasters } from "./assignedMasters";
  
  @Entity({ name: "Roles" })
  export class Roles {
  
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ type: "nvarchar", length: 200 })
    RoleName!: string;
      
    @Column({ type: "nvarchar", length: 10, default: null })
    IsMobile!: string;

    @OneToMany(() => UserData, user => user.RoleId, {cascade: true, onDelete: 'CASCADE'})
    UserDataFK!: UserData[]

    @OneToMany(() => RolesAccess, ra => ra.RoleId, {cascade: true, onDelete: 'CASCADE'})
    RolesAccess!: RolesAccess[];

    @OneToMany(() => AssignedMasters, am => am.RoleId, {cascade: true, onDelete: 'CASCADE'})
    AssignedMasterFK!: AssignedMasters[];

    @OneToMany(() => ChildRoles, am => am.RoleId, {cascade: true, onDelete: 'CASCADE'})
    ChildRolesFK!: ChildRoles[];

    @CreateDateColumn()
    CreatedDate!: Date;
  
    @UpdateDateColumn()
    UpdatedDate!: Date;
  };
  